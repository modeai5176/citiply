import { HeroSection } from "@/components/home/HeroSection";
import { BrandPhilosophy } from "@/components/home/BrandPhilosophy";
import { VeneerArt } from "@/components/home/VeneerArt";
import { DoorsFeature } from "@/components/home/DoorsFeature";
import { PlywoodFeature } from "@/components/home/PlywoodFeature";
import { RoomDiscovery } from "@/components/home/RoomDiscovery";
import { ProjectsShowcase } from "@/components/home/ProjectsShowcase";
import { MoodCollections } from "@/components/home/MoodCollections";
import { ArchitectMode } from "@/components/home/ArchitectMode";
import { CatalogueLookbook } from "@/components/home/CatalogueLookbook";
import { WarmEnquiry } from "@/components/home/WarmEnquiry";
import { getCatalogues } from "@/lib/catalogue-data";
import { getProjects } from "@/lib/projects-data";

export const revalidate = 300;

export default async function HomePage() {
  const [catalogues, projects] = await Promise.all([getCatalogues(), getProjects()]);

  return (
    <>
      <HeroSection />
      <BrandPhilosophy />
      <VeneerArt />
      <DoorsFeature />
      <PlywoodFeature />
      <RoomDiscovery />
      <ProjectsShowcase projects={projects} />
      <ArchitectMode />
      <MoodCollections />
      <CatalogueLookbook catalogues={catalogues} />
      <WarmEnquiry />
    </>
  );
}
