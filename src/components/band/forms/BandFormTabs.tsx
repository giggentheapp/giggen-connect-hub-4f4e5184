import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Wrench, Coffee, Image, Share2, Music } from 'lucide-react';

export const BandFormTabs = () => {
  return (
    <div className="relative -mx-3 md:mx-0">
      <TabsList className="w-full grid grid-cols-6 gap-0 p-1 bg-muted/30 rounded-none md:rounded-lg border-b md:border">
        <TabsTrigger
          value="basic"
          className="flex items-center justify-center gap-1.5 data-[state=active]:bg-background"
        >
          <Info className="h-4 w-4" />
          <span className="hidden md:inline text-xs md:text-sm">Grunnleggende</span>
        </TabsTrigger>
        <TabsTrigger
          value="tech"
          className="flex items-center justify-center gap-1.5 data-[state=active]:bg-background"
        >
          <Wrench className="h-4 w-4" />
          <span className="hidden md:inline text-xs md:text-sm">Tech</span>
        </TabsTrigger>
        <TabsTrigger
          value="hospitality"
          className="flex items-center justify-center gap-1.5 data-[state=active]:bg-background"
        >
          <Coffee className="h-4 w-4" />
          <span className="hidden md:inline text-xs md:text-sm">Hospitality</span>
        </TabsTrigger>
        <TabsTrigger
          value="portfolio"
          className="flex items-center justify-center gap-1.5 data-[state=active]:bg-background"
        >
          <Image className="h-4 w-4" />
          <span className="hidden md:inline text-xs md:text-sm">Portfolio</span>
        </TabsTrigger>
        <TabsTrigger
          value="social"
          className="flex items-center justify-center gap-1.5 data-[state=active]:bg-background"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden md:inline text-xs md:text-sm">Sosiale</span>
        </TabsTrigger>
        <TabsTrigger
          value="music"
          className="flex items-center justify-center gap-1.5 data-[state=active]:bg-background"
        >
          <Music className="h-4 w-4" />
          <span className="hidden md:inline text-xs md:text-sm">Musikk</span>
        </TabsTrigger>
      </TabsList>
    </div>
  );
};
