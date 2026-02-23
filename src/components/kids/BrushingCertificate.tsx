import { forwardRef } from 'react';
import { Award, Star, Calendar } from 'lucide-react';

interface BrushingCertificateProps {
  childName: string;
  date: string;
  score: number;
  bacteriaKilled: number;
  badges: string[];
}

export const BrushingCertificate = forwardRef<HTMLDivElement, BrushingCertificateProps>(
  ({ childName, date, score, bacteriaKilled, badges }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-gradient-to-br from-yellow-50 via-white to-yellow-50 p-8 rounded-3xl border-8 border-yellow-400 shadow-2xl max-w-2xl mx-auto"
        style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Award className="w-14 h-14 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-yellow-600 mb-2">CERTIFICAT</h1>
          <p className="text-xl text-gray-600">de Periuțar Profesionist</p>
        </div>

        {/* Decorative line */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        </div>

        {/* Content */}
        <div className="text-center space-y-4 mb-6">
          <p className="text-lg text-gray-600">Se acordă cu mândrie lui/luiei</p>
          <h2 className="text-4xl font-bold text-green-600 py-2 px-6 bg-green-100 rounded-full inline-block">
            {childName || 'Super Erou'}
          </h2>
          <p className="text-lg text-gray-600">
            pentru că a învățat să se perieze corect pe dinți
            <br />
            alături de Dino Periuța!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">2:00</p>
            <p className="text-sm text-gray-600">Minute periaj</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{score}</p>
            <p className="text-sm text-gray-600">Puncte acumulate</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{bacteriaKilled}</p>
            <p className="text-sm text-gray-600">Bacterii eliminate</p>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-6">
            <p className="text-center text-gray-600 mb-3">Insigne câștigate:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full font-semibold border-2 border-yellow-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
          <Calendar className="w-5 h-5" />
          <span>{date}</span>
        </div>

        {/* Footer with signatures */}
        <div className="flex justify-between items-end mt-8">
          <div className="text-center">
            <div className="w-24 h-1 bg-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Semnătura Părintelui</p>
          </div>
          <div className="text-center">
            <div className="text-6xl mb-2">🦖</div>
            <p className="text-sm font-bold text-green-600">Dino Periuța</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-1 bg-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Semnătura Copilului</p>
          </div>
        </div>

        {/* Official stamp */}
        <div className="absolute bottom-4 right-4 opacity-20">
          <div className="w-32 h-32 border-4 border-green-600 rounded-full flex items-center justify-center transform rotate-[-15deg]">
            <div className="text-center">
              <p className="text-green-600 font-bold text-xs">CLINICA</p>
              <p className="text-green-600 font-bold text-xs">DR. LUNG</p>
              <p className="text-green-600 text-xs">APROBAT</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BrushingCertificate.displayName = 'BrushingCertificate';
