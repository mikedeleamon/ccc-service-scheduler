import { useRouter } from 'next/navigation';
import { BiArrowBack } from 'react-icons/bi';

export default function BackButton() {
    const router = useRouter();

    return (
        <button
            className='absolute top-20 left-4 text-zinc-600 dark:text-zinc-400 flex items-center gap-2'
            onClick={() => router.push('/')}
        >
            <BiArrowBack size={36} />
        </button>
    );
}
