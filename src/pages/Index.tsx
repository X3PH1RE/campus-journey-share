
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, MapIcon, CarIcon, StarIcon, ShieldIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center py-20 px-4 md:py-32 bg-gradient-to-br from-primary/5 to-background border-b">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Campus rides made <span className="text-primary">simple</span> and <span className="text-primary">safe</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Hailo connects students with student drivers for affordable, convenient rides around campus and beyond.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link to={user ? "/app" : "/auth"}>
                    {user ? "Request a Ride" : "Get Started"}
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[300px] md:h-[400px] bg-accent rounded-lg overflow-hidden shadow-xl hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1556122071-e404eaedb77f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="College students using ride sharing app" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Hailo</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Safe, affordable, and convenient rides exclusively for college students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <ShieldIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Student Verified</h3>
              <p className="text-muted-foreground">
                All drivers and riders are verified students, creating a safe and trusted community.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MapIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Campus Coverage</h3>
              <p className="text-muted-foreground">
                Convenient rides to anywhere on campus or nearby areas, perfect for classes, events, or shopping runs.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <StarIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Student Drivers</h3>
              <p className="text-muted-foreground">
                Fellow students earn money driving, creating a community-driven service with fair prices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5 border-t">
        <div className="container max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to ride or drive?</h2>
            <p className="text-muted-foreground mb-8">
              Join Hailo today and experience the easiest way to get around campus. Sign up takes less than a minute.
            </p>
            <Button size="lg" asChild>
              <Link to={user ? "/app" : "/auth"}>
                {user ? "Go to Dashboard" : "Get Started Now"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8 px-4">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <CarIcon className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">Hailo</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Hailo. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
