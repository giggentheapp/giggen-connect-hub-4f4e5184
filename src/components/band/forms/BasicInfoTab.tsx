import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FolderOpen, Mail, Disc } from 'lucide-react';
import { useState } from 'react';

interface BasicInfoTabProps {
  formData: {
    name: string;
    genre: string;
    description: string;
    bio: string;
    foundedYear: string;
  };
  onChange: (field: string, value: string) => void;
  logoPreview: string | null;
  bannerPreview: string | null;
  onSelectLogo: () => void;
  onSelectBanner: () => void;
  contactInfo: {
    email: string;
    phone: string;
    bookingEmail: string;
  };
  onContactChange: (field: string, value: string) => void;
  discography: string[];
  onAddSong: (song: string) => void;
  onRemoveSong: (index: number) => void;
}

export const BasicInfoTab = ({
  formData,
  onChange,
  logoPreview,
  bannerPreview,
  onSelectLogo,
  onSelectBanner,
  contactInfo,
  onContactChange,
  discography,
  onAddSong,
  onRemoveSong,
}: BasicInfoTabProps) => {
  const [newSong, setNewSong] = useState('');

  const handleAddSong = () => {
    if (newSong.trim()) {
      onAddSong(newSong);
      setNewSong('');
    }
  };

  return (
    <Card>
      <CardContent className="pt-4 md:pt-6 space-y-4 md:space-y-5">
        {/* Logo and Banner */}
        <div className="space-y-4">
          {/* Logo section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Logo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 shrink-0 ring-2 ring-border">
                <AvatarImage src={logoPreview || undefined} />
                <AvatarFallback className="text-lg">
                  {formData.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSelectLogo}
                className="w-full md:w-auto"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Velg fra Filbank</span>
                <span className="xs:hidden">Velg logo</span>
              </Button>
            </div>
          </div>

          {/* Banner section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Banner</Label>
            {bannerPreview && (
              <div className="relative w-full h-32 md:h-40 rounded-lg overflow-hidden border">
                <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSelectBanner}
              className="w-full"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              {bannerPreview ? 'Endre banner' : 'Velg banner fra Filbank'}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-3 md:space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">
              Bandnavn <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Navn på bandet (påkrevd)"
              required
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">Dette er det eneste obligatoriske feltet</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="genre" className="text-sm">
                Sjanger
              </Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => onChange('genre', e.target.value)}
                placeholder="F.eks. Rock, Jazz, Pop"
                className="text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="foundedYear" className="text-sm">
                Stiftet år
              </Label>
              <Input
                id="foundedYear"
                type="number"
                value={formData.foundedYear}
                onChange={(e) => onChange('foundedYear', e.target.value)}
                placeholder="F.eks. 2020"
                className="text-base"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm">
              Kort beskrivelse
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="En kort beskrivelse av bandet"
              rows={3}
              className="text-base resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-sm">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => onChange('bio', e.target.value)}
              placeholder="En lengre bio om bandet"
              rows={5}
              className="text-base resize-none"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 md:space-y-4 pt-4 border-t">
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 md:h-5 md:w-5" />
            Kontaktinformasjon
          </h3>
          <div className="space-y-3 md:space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">
                E-post
              </Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => onContactChange('email', e.target.value)}
                placeholder="kontakt@band.no"
                className="text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">
                Telefon
              </Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => onContactChange('phone', e.target.value)}
                placeholder="+47 123 45 678"
                className="text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bookingEmail" className="text-sm">
                Booking e-post
              </Label>
              <Input
                id="bookingEmail"
                type="email"
                value={contactInfo.bookingEmail}
                onChange={(e) => onContactChange('bookingEmail', e.target.value)}
                placeholder="booking@band.no"
                className="text-base"
              />
            </div>
          </div>
        </div>

        {/* Discography */}
        <div className="space-y-3 md:space-y-4 pt-4 border-t">
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Disc className="h-4 w-4 md:h-5 md:w-5" />
            Diskografi
          </h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={newSong}
                onChange={(e) => setNewSong(e.target.value)}
                placeholder="Navn på sang/album"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSong())}
                className="text-base"
              />
              <Button type="button" onClick={handleAddSong} size="sm" className="shrink-0 px-3 md:px-4">
                <span className="hidden md:inline">Legg til</span>
                <span className="md:hidden">+</span>
              </Button>
            </div>
            {discography.length > 0 && (
              <div className="space-y-1.5">
                {discography.map((song, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-muted/30 border"
                  >
                    <span className="text-sm flex-1 truncate pr-2">{song}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSong(idx)}
                      className="shrink-0 h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
