'use client';

type AddPersonButtonProps = {
  onClick: () => void;
};

export default function AddPersonButton({ onClick }: AddPersonButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Add person
    </button>
  );
}

