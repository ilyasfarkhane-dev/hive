import AuthWrapper from '@/context/AuthWrapper';
import About from "@/components/SiteHeader";
import Rooms from "@/components/Content";

export default function Home() {
  return (
    <AuthWrapper>
      <main>
        <About />
        <Rooms />
      </main>
    </AuthWrapper>
  );
}