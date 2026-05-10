export default function Background() {
  return (
    <div>
      <div
        className="fixed inset-0 
  bg-[linear-gradient(to_bottom_right,_rgb(255,255,255)_100%,_rgb(255,255,255)_100%)] 
  dark:[background:linear-gradient(to_bottom_right,_rgb(23,35,50)_75%,_rgb(76,29,109)_75%)]"
      ></div>

      {/* Radial Overlay for Depth */}
      <div
        className="fixed inset-0 
  bg-[radial-gradient(ellipse_at_top_right,_rgba(168,85,247,0.15),_transparent_70%)] 
  dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(147,51,234,0.3),_transparent_70%)]"
      ></div>

      {/* Floating Orbs */}
      <div
        className="fixed top-1/4 left-1/4 w-96 h-96 
  bg-gradient-to-r from-purple-200/20 to-purple-300/20 
  dark:from-blue-500/10 dark:to-purple-500/10 
  rounded-full blur-3xl animate-pulse"
      ></div>

      <div
        className="fixed bottom-1/4 right-1/4 w-80 h-80 
  bg-gradient-to-r from-purple-200/20 to-pink-300/20 
  dark:from-purple-500/10 dark:to-pink-500/10 
  rounded-full blur-3xl animate-pulse delay-1000"
      ></div>
    </div>
  );
}
