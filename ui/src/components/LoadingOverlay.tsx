export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-3xl">
      <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
      <p className="font-bold text-slate-800">Mining Transaction...</p>
      <p className="text-xs text-gray-500">Please check MetaMask</p>
    </div>
  );
}
