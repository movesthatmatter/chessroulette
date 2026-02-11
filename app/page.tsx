import { Metadata } from "next";
import Header from "@/components/Header/Header";
import { MainHomeSection } from "@/modules/Home/MainHomeSection";
import { authOptions } from "@/services/Auth";
import { getCustomServerSession } from "@/services/Auth/getCustomServerSession";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Chessroulette",
  description: "",
};

export default async function Home() {
  const session = await getCustomServerSession(authOptions);

  return (
    <div className="flex flex-col h-full container mx-auto">
      <Header showOnboarding session={session} />
      <MainHomeSection session={session} />
      <Footer />
    </div>
  );
}
