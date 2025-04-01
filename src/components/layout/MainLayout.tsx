
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MotorcycleIcon, 
  HomeIcon, 
  LogOutIcon, 
  UserIcon,
  ChevronDownIcon,
  MenuIcon,
  MapPinIcon,
  BadgeIndianRupeeIcon,
  GraduationCapIcon,
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { user, profile, isDriver, toggleDriverMode, signOut } = useAuth();
  const [open, setOpen] = React.useState(false);
  
  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: isDriver ? 'Driver Dashboard' : 'Request Ride', href: '/app', icon: isDriver ? MotorcycleIcon : MapPinIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="hailo-gradient p-2 rounded-full">
                <MotorcycleIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Hailo</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 px-3 py-2 rounded-md",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/60 hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-3 mr-2 px-3 py-1.5 border border-primary/20 rounded-full">
                  <Switch
                    id="driver-mode"
                    checked={isDriver}
                    onCheckedChange={toggleDriverMode}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="driver-mode" className="text-sm cursor-pointer">
                    {isDriver ? 'Driver Mode' : 'Rider Mode'}
                  </Label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <div className="flex items-center gap-3 p-3 border-b">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="font-medium">{profile?.full_name || user.email?.split('@')[0]}</p>
                        <p className="w-full truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="p-2">
                      <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 rounded-md hover:bg-muted">
                        <Link to="/profile" className="flex items-center gap-3">
                          <UserIcon className="h-4 w-4 text-primary" />
                          <div className="flex flex-col">
                            <span>My Profile</span>
                            <span className="text-xs text-muted-foreground">Manage your details</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      {profile?.is_driver && (
                        <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 rounded-md hover:bg-muted">
                          <Link to="/app" className="flex items-center gap-3">
                            <BadgeIndianRupeeIcon className="h-4 w-4 text-primary" />
                            <div className="flex flex-col">
                              <span>Earnings</span>
                              <span className="text-xs text-muted-foreground">View your earnings</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem asChild className="w-full justify-between md:hidden cursor-pointer px-3 py-2 rounded-md hover:bg-muted">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <MotorcycleIcon className="h-4 w-4 text-primary" />
                            <span>{isDriver ? 'Driver Mode' : 'Rider Mode'}</span>
                          </div>
                          <Switch
                            checked={isDriver}
                            onCheckedChange={toggleDriverMode}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <DropdownMenuItem
                        className="cursor-pointer px-3 py-2 rounded-md hover:bg-destructive/10 hover:text-destructive"
                        onSelect={() => signOut()}
                      >
                        <LogOutIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild size="sm" className="hailo-btn-gradient">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                >
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex items-center gap-2 py-4 px-2 mb-6">
                  <div className="hailo-gradient p-2 rounded-full">
                    <MotorcycleIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Hailo</span>
                </div>
                <nav className="flex flex-col gap-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gradient-to-b from-background to-accent/20">{children}</main>
      <footer className="border-t py-6 bg-muted/50">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="hailo-gradient p-1.5 rounded-full">
                <MotorcycleIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Hailo</span>
              <span className="text-sm text-muted-foreground">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary">Home</Link>
              <Link to="/app" className="text-sm text-muted-foreground hover:text-primary">Request Ride</Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary">Profile</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
