export default function Avatar({ name = "?", size = 44, online }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div
        className="grid place-items-center rounded-full text-white font-semibold"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg,#ffb199,#ff6b5b)",
          fontSize: size * 0.4,
        }}
      >
        {letter}
      </div>
      {online !== undefined && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: online ? "#22c55e" : "#9ca3af",
          }}
        />
      )}
    </div>
  );
}
