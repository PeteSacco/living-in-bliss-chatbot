import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button'; 

export const GoogleAuthButton = ({ label = 'Continue with Google' }: { label?: string }) => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={() => signIn('google')}
    >
      <FcGoogle className="h-5 w-5" />
      {label}
    </Button>
  );
}
