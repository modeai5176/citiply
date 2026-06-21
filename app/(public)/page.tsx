import { HeroSection } from "@/components/home/HeroSection";
import { BrandPhilosophy } from "@/components/home/BrandPhilosophy";
import { VeneerArt } from "@/components/home/VeneerArt";
import { DoorsFeature } from "@/components/home/DoorsFeature";
import { PlywoodFeature } from "@/components/home/PlywoodFeature";
import { RoomDiscovery } from "@/components/home/RoomDiscovery";
import { MoodCollections } from "@/components/home/MoodCollections";
import { ArchitectMode } from "@/components/home/ArchitectMode";
import { CatalogueLookbook } from "@/components/home/CatalogueLookbook";
import { WarmEnquiry } from "@/components/home/WarmEnquiry";

export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BrandPhilosophy />
      <VeneerArt />
      <DoorsFeature />
      <PlywoodFeature />
      <RoomDiscovery />
      <MoodCollections />
      <ArchitectMode />
      <CatalogueLookbook />
      <WarmEnquiry />
    </>
  );
}
