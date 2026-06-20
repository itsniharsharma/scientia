import { Hero } from './sections/Hero';
import { WhyScientia } from './sections/WhyScientia';
import { LearningJourney } from './sections/LearningJourney';
import { Features } from './sections/Features';
import { Testimonials } from './sections/Testimonials';
import { CallToAction } from './sections/CallToAction';

export function HomePage() {
  return (
    <>
      <Hero />
      <WhyScientia />
      <LearningJourney />
      <Features />
      <Testimonials />
      <CallToAction />
    </>
  );
}
