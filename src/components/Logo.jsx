export default function Logo({ size = 36 }) {
  return (
    <div
      className="grid place-items-center rounded-2xl text-white font-bold shadow-md"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg,#ff8a7a,#ff6b5b)",
      }}
    >
      C
    </div>
  );
}
