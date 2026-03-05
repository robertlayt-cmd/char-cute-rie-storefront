import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, AlertTriangle } from 'lucide-react';

export default function ErrorLogger() {
  const [errors, setErrors] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Capture console errors
    const originalError = console.error;
    console.error = (...args) => {
      const errorMsg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setErrors(prev => [...prev, { type: 'error', message: errorMsg, time: new Date().toLocaleTimeString() }]);
      originalError(...args);
    };

    // Capture unhandled errors
    const handleError = (event) => {
      setErrors(prev => [...prev, { 
        type: 'uncaught', 
        message: `${event.error?.message || event.message}`, 
        time: new Date().toLocaleTimeString() 
      }]);
    };

    // Capture unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      setErrors(prev => [...prev, { 
        type: 'unhandled-rejection', 
        message: `${event.reason}`, 
        time: new Date().toLocaleTimeString() 
      }]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <>
      {/* Error Button - Fixed bottom right */}
      {errors.length > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-[999] bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg font-bold"
          title={`${errors.length} error(s)`}
        >
          {errors.length}
        </button>
      )}

      {/* Error Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-950 border-red-900">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Error Log ({errors.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {errors.map((err, idx) => (
              <div key={idx} className="bg-zinc-900 border border-red-900/50 rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between mb-1">
                  <span className="inline-block px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs font-mono font-bold">
                    {err.type.toUpperCase()}
                  </span>
                  <span className="text-zinc-500 text-xs">{err.time}</span>
                </div>
                <pre className="text-red-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-words bg-black/30 p-2 rounded mt-2">
                  {err.message}
                </pre>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setErrors([])}
              className="border-zinc-700"
            >
              Clear Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="border-zinc-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}