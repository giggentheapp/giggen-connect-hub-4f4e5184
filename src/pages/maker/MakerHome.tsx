export default function MakerHome() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Velkommen til Maker Dashboard</h2>
        <p className="text-muted-foreground">
          Administrer dine arrangementer og bookinger
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Mine Arrangementer</h3>
          <p className="text-sm text-muted-foreground">
            Se og rediger dine arrangementer
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Bookinger</h3>
          <p className="text-sm text-muted-foreground">
            Administrer innkommende forespørsler
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Profil</h3>
          <p className="text-sm text-muted-foreground">
            Oppdater din maker-profil
          </p>
        </div>
      </div>
    </div>
  );
}