const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// POST /api/kids/brushing-complete - Save brushing session
router.post('/brushing-complete', async (req, res) => {
  try {
    const { childId, childName, duration, score, bacteriaKilled, badgesEarned } = req.body;

    // Validate required fields
    if (!childId || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Anti-cheat: Validate duration (should be around 120 seconds)
    if (duration < 60 || duration > 300) {
      return res.status(400).json({ error: 'Invalid session duration' });
    }

    // Anti-cheat: Validate score (should be reasonable for the duration)
    const maxPossibleScore = duration * 2; // Max 2 points per second
    if (score > maxPossibleScore) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    // Save session to database
    const { data: session, error: sessionError } = await supabase
      .from('brushing_sessions')
      .insert([{
        child_id: childId,
        child_name: childName || 'Anonymous',
        duration: duration,
        score: score || 0,
        bacteria_killed: bacteriaKilled || 0,
        badges_earned: badgesEarned || [],
        completed_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (sessionError) {
      console.error('Error saving brushing session:', sessionError);
      return res.status(500).json({ error: 'Failed to save session' });
    }

    // Update or create child's progress
    const { data: existingProgress } = await supabase
      .from('brushing_progress')
      .select('*')
      .eq('child_id', childId)
      .single();

    if (existingProgress) {
      // Calculate new streak
      const lastSession = new Date(existingProgress.last_session_date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = existingProgress.current_streak;
      if (lastSession.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
        // Already brushed today, keep streak
      } else if (lastSession.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        // Brushed yesterday, increment streak
        newStreak += 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      // Merge badges
      const allBadges = [...new Set([...existingProgress.badges, ...(badgesEarned || [])])];

      const { error: updateError } = await supabase
        .from('brushing_progress')
        .update({
          total_sessions: existingProgress.total_sessions + 1,
          total_bacteria_killed: existingProgress.total_bacteria_killed + (bacteriaKilled || 0),
          current_streak: newStreak,
          longest_streak: Math.max(existingProgress.longest_streak, newStreak),
          last_session_date: new Date().toISOString(),
          badges: allBadges,
          updated_at: new Date().toISOString(),
        })
        .eq('child_id', childId);

      if (updateError) {
        console.error('Error updating progress:', updateError);
      }
    } else {
      // Create new progress record
      const { error: insertError } = await supabase
        .from('brushing_progress')
        .insert([{
          child_id: childId,
          child_name: childName || 'Anonymous',
          total_sessions: 1,
          total_bacteria_killed: bacteriaKilled || 0,
          current_streak: 1,
          longest_streak: 1,
          last_session_date: new Date().toISOString(),
          badges: badgesEarned || [],
        }]);

      if (insertError) {
        console.error('Error creating progress:', insertError);
      }
    }

    res.json({
      success: true,
      session,
      message: 'Brushing session saved successfully',
    });
  } catch (error) {
    console.error('Error in brushing-complete:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/kids/progress/:childId - Get child's brushing progress
router.get('/progress/:childId', async (req, res) => {
  try {
    const { childId } = req.params;

    const { data: progress, error } = await supabase
      .from('brushing_progress')
      .select('*')
      .eq('child_id', childId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching progress:', error);
      return res.status(500).json({ error: 'Failed to fetch progress' });
    }

    // Get recent sessions
    const { data: sessions } = await supabase
      .from('brushing_sessions')
      .select('*')
      .eq('child_id', childId)
      .order('completed_at', { ascending: false })
      .limit(30);

    res.json({
      progress: progress || {
        child_id: childId,
        total_sessions: 0,
        total_bacteria_killed: 0,
        current_streak: 0,
        longest_streak: 0,
        badges: [],
      },
      sessions: sessions || [],
    });
  } catch (error) {
    console.error('Error in get progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/kids/leaderboard - Get top brushers (optional feature)
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data: leaders, error } = await supabase
      .from('brushing_progress')
      .select('child_name, total_sessions, current_streak, badges')
      .order('total_sessions', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }

    res.json({ leaderboard: leaders });
  } catch (error) {
    console.error('Error in leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kids/validate-badge - Validate badge on server side
router.post('/validate-badge', async (req, res) => {
  try {
    const { childId, badgeId } = req.body;

    // Badge validation rules
    const BADGE_RULES = {
      'first_brush': { minSessions: 1 },
      'week_warrior': { minStreak: 7 },
      'bacteria_hunter': { minBacteria: 100 },
      'perfect_week': { minStreak: 7, perfectWeek: true },
      'master_brusher': { minSessions: 30 },
    };

    const rule = BADGE_RULES[badgeId];
    if (!rule) {
      return res.status(400).json({ error: 'Invalid badge ID' });
    }

    // Get child's progress
    const { data: progress } = await supabase
      .from('brushing_progress')
      .select('*')
      .eq('child_id', childId)
      .single();

    if (!progress) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Validate badge criteria
    let valid = true;
    if (rule.minSessions && progress.total_sessions < rule.minSessions) valid = false;
    if (rule.minStreak && progress.current_streak < rule.minStreak) valid = false;
    if (rule.minBacteria && progress.total_bacteria_killed < rule.minBacteria) valid = false;

    res.json({ 
      valid,
      badgeId,
      childId,
      currentProgress: {
        sessions: progress.total_sessions,
        streak: progress.current_streak,
        bacteria: progress.total_bacteria_killed,
      }
    });
  } catch (error) {
    console.error('Error validating badge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
