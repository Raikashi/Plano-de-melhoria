interface SectionHeaderProps {
  number: string;
  title: string;
}

export default function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline gap-4 mb-8">
      <span className="text-5xl font-headline font-black text-slate-200/60 tracking-tighter">
        {number}
      </span>
      <h3 className="text-xl font-headline font-bold text-slate-800">
        {title}
      </h3>
    </div>
  );
}
