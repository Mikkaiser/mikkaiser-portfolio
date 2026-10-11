import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./blog.css";

export default function BlogLayout({ children }: LayoutProps<"/blog">) {
  return (
    <div id="top" className="blog-top">
      <Header current="blog" />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
