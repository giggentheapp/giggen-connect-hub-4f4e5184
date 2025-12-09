import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, Users, CreditCard, AlertTriangle } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { navigateBack } from '@/lib/navigation';

const Terms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigateBack(navigate, location, '/')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
            <div className="text-2xl font-bold text-primary">GIGGEN</div>
            <Button onClick={() => navigate('/auth')} variant="outline">
              {t('signIn')}
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
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">{t('termsAndConditions')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('lastUpdated')}: 19. september 2024
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-8 border-2">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('welcomeToGiggen')}
              </p>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="mb-8 border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-6 w-6 text-primary mr-3" />
                {t('userResponsibility')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('asUserYouCommit')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('provideCorrectInfo')}</li>
                  <li>• {t('keepAccountSecure')}</li>
                  <li>• {t('notMisuseService')}</li>
                  <li>• {t('respectUserRights')}</li>
                  <li>• {t('noInappropriateContent')}</li>
                  <li>• {t('followLaws')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('prohibitedUse')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('spamCommunication')}</li>
                  <li>• {t('fakeProfiles')}</li>
                  <li>• {t('copyrightViolation')}</li>
                  <li>• {t('malwareVirus')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Booking Process */}
          <Card className="mb-8 border-2 hover:border-accent-green/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-6 w-6 text-accent-green mr-3" />
                {t('bookingProcessAndResponsibility')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('threeStepBooking')}</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>{t('organizerSendsRequest')}</li>
                  <li>{t('musicianApprovesRejects')}</li>
                  <li>{t('bindingAgreement')}</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('responsibilitiesObligations')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('giggenIsIntermediaryOnly')}</li>
                  <li>• {t('agreementsDirectly')}</li>
                  <li>• {t('bothPartiesResponsible')}</li>
                  <li>• {t('giggenNotResponsibleQuality')}</li>
                  <li>• {t('cancellationFollowAgreement')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card className="mb-8 border-2 hover:border-accent-orange/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-6 w-6 text-accent-orange mr-3" />
                {t('paymentTerms')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('serviceCurrentlyFree')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('reserveRightIntroduceFees')}</li>
                  <li>• {t('thirtyDaysNotice')}</li>
                  <li>• {t('existingUsersInformed')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('futurePaymentServices')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('integratedPaymentSolutions')}</li>
                  <li>• {t('standardFeesApply')}</li>
                  <li>• {t('feesWillBeCommunicated')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card className="mb-8 border-2 hover:border-accent-pink/50 transition-all">
            <CardHeader>
              <CardTitle className="text-foreground">{t('copyrightIntellectualRights')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('yourContent')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('retainAllRights')}</li>
                  <li>• {t('grantUsLicense')}</li>
                  <li>• {t('responsibleForRights')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('ourPlatform')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('giggenPlatformProtected')}</li>
                  <li>• {t('cannotCopyCode')}</li>
                  <li>• {t('trademarksRegistered')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card className="mb-8 border-2 hover:border-destructive/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-3" />
                {t('disclaimerTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('giggenNotResponsibleFor')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('qualityOfMusicians')}</li>
                  <li>• {t('contractBreaches')}</li>
                  <li>• {t('directIndirectLoss')}</li>
                  <li>• {t('serviceInterruptions')}</li>
                  <li>• {t('contentFromOtherUsers')}</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                {t('serviceAsIs')}
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="mb-8 border-2">
            <CardHeader>
              <CardTitle className="text-foreground">{t('termination')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('youCan')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('deleteAccountAnytime')}</li>
                  <li>• {t('stopUsingService')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('weCan')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('suspendDeleteAccounts')}</li>
                  <li>• {t('terminateServiceNotice')}</li>
                  <li>• {t('changeTermsNotice')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="text-foreground">{t('contactApplicableLaw')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('questionsAboutTerms')}</h4>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>{t('email')}:</strong> juridisk@giggen.org</p>
                  <p><strong>{t('mail')}:</strong> {t('giggenASAddress')}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t('applicableLaw')}</h4>
                <p className="text-muted-foreground">
                  {t('termsUnderNorwegianLaw')}
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
              onClick={() => navigate('/about')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('aboutUs')}
            </button>
            <button 
              onClick={() => navigate('/privacy')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('privacyPolicy')}
            </button>
            <a 
              href="mailto:info@giggen.org"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('contact')}
            </a>
          </div>
          <p className="text-muted-foreground">&copy; 2024 Giggen AS. {t('allRightsReserved')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;