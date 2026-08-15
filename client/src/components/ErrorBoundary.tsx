import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background" role="alert" aria-live="assertive" data-testid="error-boundary-500">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <p className="text-sm font-semibold tracking-[0.14em] text-destructive mb-2">ERROR 500 / সার্ভার ত্রুটি</p>
            <h2 className="text-xl font-bold mb-2">Something went wrong / একটি অপ্রত্যাশিত সমস্যা হয়েছে</h2>
            <p className="text-center text-muted-foreground mb-1">Please reload the page and try again. Your private data has not been sent or saved by this error screen.</p>
            <p className="text-center text-sm text-muted-foreground mb-6">পেজটি রিলোড করে আবার চেষ্টা করুন। এই ত্রুটি পর্দা আপনার ব্যক্তিগত তথ্য পাঠায় বা সংরক্ষণ করে না।</p>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload page / পেজ রিলোড করুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
