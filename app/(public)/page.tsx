import { HeroSection } from "@/components/home/HeroSection";
import { BrandPhilosophy } from "@/components/home/BrandPhilosophy";
// import { VeneerArt } from "@/components/home/VeneerArt";
import { DoorsFeature } from "@/components/home/DoorsFeature";
import { PlywoodFeature } from "@/components/home/PlywoodFeature";
import { RoomDiscovery } from "@/components/home/RoomDiscovery";
import { FullRangeGrid } from "@/components/home/FullRangeGrid";
import { HeritageStrip } from "@/components/home/HeritageStrip";
import { EcosystemSpace } from "@/components/home/EcosystemSpace";
import { BuildPalette } from "@/components/home/BuildPalette";
import { ArchitectMode } from "@/components/home/ArchitectMode";
import { RealProjects } from "@/components/home/RealProjects";
import { WarmEnquiry } from "@/components/home/WarmEnquiry";
import { getProductFamilies } from "@/lib/catalogue-data";
import { getProjects } from "@/lib/projects-data";

export const revalidate = 300;

export default async function HomePage() {
  const [families, projects] = await Promise.all([getProductFamilies(), getProjects()]);

  return (
    <>
      <HeroSection projects={projects} />
      <BrandPhilosophy />
      {/* Veneer as Art — horizontal scroll section (commented out) */}
      {/* <VeneerArt /> */}
      <DoorsFeature />
      <PlywoodFeature />
      <FullRangeGrid families={families} />
      <HeritageStrip />
      <RoomDiscovery />
      {/* <EcosystemSpace /> */}
      <RealProjects projects={projects} />
      <BuildPalette />
      <ArchitectMode />
      <WarmEnquiry />
    </>
  );
}
