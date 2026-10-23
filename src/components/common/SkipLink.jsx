export default function SkipLink({ targetId }) {
  return (
    <a className="skip-link" href={`#${targetId}`}>
      Lewati ke konten utama
    </a>
  );
}
