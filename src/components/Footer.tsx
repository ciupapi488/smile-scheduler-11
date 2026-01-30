export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">D</span>
            </div>
            <span className="font-semibold text-foreground">DentaCare</span>
          </div>
          
          <div className="text-center text-sm text-muted-foreground md:text-right">
            <p className="mb-1">© {new Date().getFullYear()} DentaCare. All rights reserved.</p>
            <p className="text-xs">
              GDPR Notice: We collect and process your personal data in accordance with the General Data Protection Regulation (EU) 2016/679. 
              Your data is used solely for appointment scheduling and patient care purposes.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
