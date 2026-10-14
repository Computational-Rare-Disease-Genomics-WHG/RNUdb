export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-teal-600 border-t-transparent rounded-full" />
    </div>
  );
}
