import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail, Globe, User, MapPin } from 'lucide-react';

interface ContactInfoDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ContactInfoDialog = ({ isOpen, onConfirm, onCancel }: ContactInfoDialogProps) => {
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchContactInfo();
    }
  }, [isOpen]);

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, contact_info, address, is_address_public')
        .eq('user_id', user.id)
        .single();

      setContactInfo(profile);
    } catch (error) {
      console.error('Error fetching contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Laster kontaktinformasjon...</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getSharedContactInfo = () => {
    const sharedInfo = [];
    
    // Always share display name
    if (contactInfo?.display_name) {
      sharedInfo.push({
        icon: User,
        label: 'Navn',
        value: contactInfo.display_name
      });
    }

    // Share contact info if available
    if (contactInfo?.contact_info) {
      const { phone, email, website } = contactInfo.contact_info;
      
      if (phone) {
        sharedInfo.push({
          icon: Phone,
          label: 'Telefon',
          value: phone
        });
      }
      
      if (email) {
        sharedInfo.push({
          icon: Mail,
          label: 'E-post',
          value: email
        });
      }
      
      if (website) {
        sharedInfo.push({
          icon: Globe,
          label: 'Nettside',
          value: website
        });
      }
    }

    // Share address if public
    if (contactInfo?.address && contactInfo?.is_address_public) {
      sharedInfo.push({
        icon: MapPin,
        label: 'Adresse',
        value: contactInfo.address
      });
    }

    return sharedInfo;
  };

  const sharedInfo = getSharedContactInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deling av kontaktinformasjon</DialogTitle>
          <DialogDescription>
            Ved å sende denne forespørselen deles følgende kontaktinformasjon med mottakeren:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {sharedInfo.length > 0 ? (
            sharedInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{info.label}</p>
                    <p className="text-sm text-muted-foreground">{info.value}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Ingen kontaktinformasjon er satt opp for deling
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={onConfirm} className="flex-1">
            Bekreft og send
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Avbryt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};