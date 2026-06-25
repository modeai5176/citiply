import { Header } from "@/components/layout/Header";
import { HeaderSpacer } from "@/components/layout/HeaderSpacer";
import { Footer } from "@/components/layout/Footer";
import { QuickInquiryFab } from "@/components/catalogue/QuickInquiryFab";
import { getNavigationData } from "@/lib/catalogue-data";
import { EnquiryDrawer } from "@/components/enquiry/EnquiryDrawer";
import { EnquiryCartFab } from "@/components/enquiry/EnquiryCartFab";
import { ProjectBriefStrip } from "@/components/lead/ProjectBriefStrip";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { catalogues, categories, collections, families } = await getNavigationData();

  return (
    <>
      <Header families={families} />
      <HeaderSpacer />
      <main>{children}</main>
      <Footer catalogues={catalogues} categories={categories} collections={collections} />
      <EnquiryDrawer />
      <EnquiryCartFab />
      <QuickInquiryFab />
      <ProjectBriefStrip />
    </>
  );
}

