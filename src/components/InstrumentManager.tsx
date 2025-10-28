import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Instrument {
  instrument: string;
  details: string;
}

interface InstrumentManagerProps {
  instruments: Instrument[];
  onChange: (instruments: Instrument[]) => void;
}

const PREDEFINED_INSTRUMENTS = [
  "Vokal",
  "Gitar",
  "Bass",
  "Trommer",
  "Piano",
  "Keyboard",
  "Synthesizer",
  "Perkusjon",
  "Saksofon",
  "Trompet",
  "Trombone",
  "Klarinett",
  "Fløyte",
  "Fiolin",
  "Cello",
  "Bratsj",
  "Kontrabass",
  "Harpe",
  "DJ",
  "Produsent",
  "Låtskriver",
  "Komponist",
  "Annet"
];

export const InstrumentManager: React.FC<InstrumentManagerProps> = ({ instruments, onChange }) => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");
  const [customInstrument, setCustomInstrument] = useState<string>("");
  const [details, setDetails] = useState<string>("");

  const handleAddInstrument = () => {
    const instrumentName = selectedInstrument === "Annet" ? customInstrument : selectedInstrument;
    
    if (!instrumentName.trim()) return;

    const newInstrument: Instrument = {
      instrument: instrumentName,
      details: details.trim()
    };

    onChange([...instruments, newInstrument]);
    setSelectedInstrument("");
    setCustomInstrument("");
    setDetails("");
  };

  const handleRemoveInstrument = (index: number) => {
    onChange(instruments.filter((_, i) => i !== index));
  };

  const handleUpdateDetails = (index: number, newDetails: string) => {
    const updated = [...instruments];
    updated[index] = { ...updated[index], details: newDetails };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Legg til instrument/rolle</Label>
        
        <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
          <SelectTrigger>
            <SelectValue placeholder="Velg instrument eller rolle" />
          </SelectTrigger>
          <SelectContent>
            {PREDEFINED_INSTRUMENTS.map((instrument) => (
              <SelectItem key={instrument} value={instrument}>
                {instrument}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedInstrument === "Annet" && (
          <Input
            placeholder="Skriv inn instrument/rolle"
            value={customInstrument}
            onChange={(e) => setCustomInstrument(e.target.value)}
          />
        )}

        {selectedInstrument && (
          <div className="space-y-2">
            <Input
              placeholder="Detaljer (f.eks. 'Alt og tenor', 'Elektrisk og akustisk')"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            <Button 
              type="button"
              onClick={handleAddInstrument}
              disabled={selectedInstrument === "Annet" && !customInstrument.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Legg til
            </Button>
          </div>
        )}
      </div>

      {instruments.length > 0 && (
        <div className="space-y-2">
          <Label>Dine instrumenter/roller</Label>
          {instruments.map((item, index) => (
            <Card key={index} className="p-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.instrument}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInstrument(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Detaljer"
                  value={item.details}
                  onChange={(e) => handleUpdateDetails(index, e.target.value)}
                  className="text-sm"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
