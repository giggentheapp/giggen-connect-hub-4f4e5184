import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Users, FileText } from "lucide-react";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { navigateBack } from '@/lib/navigation';

const Privacy = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigateBack(navigate, location, "/")} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </Button>
            <div className="text-2xl font-bold text-primary">GIGGEN</div>
            <Button onClick={() => navigate("/auth")} variant="outline">
              {t("signIn")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">{t("privacyPolicyTitle")}</h1>
            <p className="text-lg text-muted-foreground">{t("lastUpdated")}: 19. september 2024</p>
          </div>

          {/* Introduction */}
          <Card className="mb-8 border-2">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground leading-relaxed">{t("giggenRespectsPrivacy")}</p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card className="mb-8 border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-6 w-6 text-primary mr-3" />
                {t("whatDataWeCollect")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t("personalInformation")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>{t("nameEmailPhone")}</li>
                  <li>{t("profileInfoPortfolio")}</li>
                  <li>{t("geographicLocation")}</li>
                  <li>{t("bookingHistoryCommunication")}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t("technicalInformation")}</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>{t("ipAddressDevice")}</li>
                  <li>{t("browserTypeVersion")}</li>
                  <li>{t("usagePatternsPreferences")}</li>
                  <li>{t("cookiesSimilarTech")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card className="mb-8 border-2 hover:border-accent-green/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-6 w-6 text-accent-green mr-3" />
                {t("howWeUseData")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>{t("deliverImproveServices")}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>{t("matchMusiciansOpportunities")}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>{t("communicateAboutService")}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>{t("ensureSafeUse")}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>{t("complyLegalObligations")}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="mb-8 border-2 hover:border-accent-orange/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 text-accent-orange mr-3" />
                {t("sharingInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{t("neverSellPersonalData")}</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• {t("withYourConsent")}</li>
                <li>• {t("withOtherUsers")}</li>
                <li>• {t("withServiceProviders")}</li>
                <li>• {t("whenRequiredByLaw")}</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card className="mb-8 border-2 hover:border-accent-pink/50 transition-all">
            <CardHeader>
              <CardTitle className="text-foreground">{t("yourRights")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{t("yourRights")}:</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• {t("rightToAccess")}</li>
                    <li>• {t("rightToCorrect")}</li>
                    <li>• {t("rightToDelete")}</li>
                    <li>• {t("rightToLimit")}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{t("youCanAlso")}</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• {t("transferData")}</li>
                    <li>• {t("objectToProcessing")}</li>
                    <li>• {t("withdrawConsent")}</li>
                    <li>• {t("complainToAuthority")}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="mb-8 border-2">
            <CardHeader>
              <CardTitle className="text-foreground">{t("security")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{t("securityMeasures")}</p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="text-foreground">{t("contactUs")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{t("privacyQuestions")}</p>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong>{t("email")}:</strong> {t("giggen.main@gmail.com")}
                </p>
                <p>
                  <strong>{t("mail")}:</strong> {t("giggenASAddress")}
                </p>
                <p>
                  <strong>{t("phoneNumber")}:</strong> +47 XX XX XX XX
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4 mt-16">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex justify-center space-x-8 mb-4">
            <button
              onClick={() => navigate("/about")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t("aboutUs")}
            </button>
            <button
              onClick={() => navigate("/terms")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t("termsAndConditions")}
            </button>
            <a href="mailto:info@giggen.org" className="text-muted-foreground hover:text-primary transition-colors">
              {t("contact")}
            </a>
          </div>
          <p className="text-muted-foreground">&copy; 2024 Giggen AS. {t("allRightsReserved")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
