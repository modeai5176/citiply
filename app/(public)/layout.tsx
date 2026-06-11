import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QuickInquiryFab } from "@/components/catalogue/QuickInquiryFab";
import { getNavigationData } from "@/lib/catalogue-data";
import { EnquiryDrawer } from "@/components/enquiry/EnquiryDrawer";
import { EnquiryCartFab } from "@/components/enquiry/EnquiryCartFab";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { catalogues, categories, collections } = await getNavigationData();

  return (
    <>
      <Header catalogues={catalogues} categories={categories} collections={collections} />
      <main>{children}</main>
      <Footer catalogues={catalogues} categories={categories} collections={collections} />
      <EnquiryDrawer />
      <EnquiryCartFab />
      <QuickInquiryFab />
    </>
  );
}

