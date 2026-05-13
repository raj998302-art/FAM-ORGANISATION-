// BlueFlameLogo — now shows the actual FAM logo
// This component is kept for backward compatibility
const FAM_LOGO = "https://i.ibb.co/39H03P4C/file-00000000b718720782db0e5073b7aac2.png";

export default function BlueFlameLogo({ className = "w-12 h-12", glow = false }) {
  return (
    <img
      src={FAM_LOGO}
      alt="Fire Arena MAX"
      className={`${className} object-contain rounded-xl ${glow ? 'drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]' : ''}`}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}
