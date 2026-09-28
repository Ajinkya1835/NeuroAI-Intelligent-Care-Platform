import Hero from "./components/home page components/hero";
import NavBar from "./components/home page components/NavBar"
import Features from "./components/home page components/Features"

export default function Home() {
  return (
    <main>
      <NavBar />
      <Hero /> 
      <Features />
    </main>
  );
}