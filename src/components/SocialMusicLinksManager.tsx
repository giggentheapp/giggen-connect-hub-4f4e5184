import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { X, Plus, ExternalLink } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: JSX.Element;
  placeholder: string;
}

interface SocialMusicLinksManagerProps {
  title: string;
  platforms: Platform[];
  links: Record<string, string>;
  onChange: (links: Record<string, string>) => void;
}

export const SocialMusicLinksManager = ({
  title,
  platforms,
  links,
  onChange,
}: SocialMusicLinksManagerProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [linkInput, setLinkInput] = useState("");

  const addLink = () => {
    if (selectedPlatform && linkInput.trim()) {
      onChange({
        ...links,
        [selectedPlatform]: linkInput.trim(),
      });
      setLinkInput("");
      setSelectedPlatform("");
    }
  };

  const removeLink = (platformId: string) => {
    const newLinks = { ...links };
    delete newLinks[platformId];
    onChange(newLinks);
  };

  const existingLinks = Object.entries(links).filter(([_, url]) => url);
  const availablePlatforms = platforms.filter(
    (p) => !existingLinks.find(([id]) => id === p.id)
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Velg plattform og legg til lenke
        </p>
      </div>

      {/* Add new link section */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="platform-select">Velg plattform</Label>
            <Select
              value={selectedPlatform}
              onValueChange={(value) => {
                setSelectedPlatform(value);
                const platform = platforms.find((p) => p.id === value);
                if (platform) {
                  setLinkInput("");
                }
              }}
            >
              <SelectTrigger id="platform-select" className="bg-background">
                <SelectValue placeholder="Velg en plattform" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {availablePlatforms.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4">{platform.icon}</div>
                      {platform.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="link-input">Lenke</Label>
            <div className="flex gap-2">
              <Input
                id="link-input"
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder={
                  selectedPlatform
                    ? platforms.find((p) => p.id === selectedPlatform)?.placeholder
                    : "Velg først en plattform"
                }
                disabled={!selectedPlatform}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
              />
              <Button
                type="button"
                onClick={addLink}
                disabled={!selectedPlatform || !linkInput.trim()}
                size="icon"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing links */}
      {existingLinks.length > 0 && (
        <div className="space-y-2">
          <Label>Dine lenker</Label>
          <div className="space-y-2">
            {existingLinks.map(([platformId, url]) => {
              const platform = platforms.find((p) => p.id === platformId);
              if (!platform) return null;

              return (
                <Card key={platformId} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-5 h-5 text-primary shrink-0">
                        {platform.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{platform.name}</p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                        >
                          <span className="truncate">{url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(platformId)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
