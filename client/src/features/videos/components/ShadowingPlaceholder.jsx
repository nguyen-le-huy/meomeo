export default function ShadowingPlaceholder() {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-black">Shadowing</h2>
      <p className="text-sm font-semibold text-coal/65">
        Nghe segment hiện tại, đọc lại theo transcript rồi gửi audio để Azure Speech chấm điểm. Phần ghi âm browser sẽ triển khai ở bước kế tiếp.
      </p>
      <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white" type="button">
        Record
      </button>
    </div>
  );
}
