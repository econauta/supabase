import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function HelpSection() {
  const { t } = useTranslation();

  const SQL_SCRIPT = `-- ${t('helpSection.sqlComment1')}
-- ${t('helpSection.sqlComment2')}
-- ${t('helpSection.sqlComment3')}

-- ${t('helpSection.sqlComment4')}
CREATE TABLE IF NOT EXISTS public._heartbeat (
  id serial PRIMARY KEY,
  pinged_at timestamptz DEFAULT now()
);

-- ${t('helpSection.sqlComment5')}
ALTER TABLE public._heartbeat ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas que podem estar causando conflitos
DROP POLICY IF EXISTS "Allow all operations on _heartbeat" ON public._heartbeat;
DROP POLICY IF EXISTS "Allow anon to insert" ON public._heartbeat;
DROP POLICY IF EXISTS "Allow anon to select" ON public._heartbeat;
DROP POLICY IF EXISTS "Allow anon to delete" ON public._heartbeat;

-- ${t('helpSection.sqlComment6')}
-- Cria políticas separadas para cada operação
CREATE POLICY "Allow anon to select heartbeat"
  ON public._heartbeat
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert heartbeat"
  ON public._heartbeat
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete old heartbeat"
  ON public._heartbeat
  FOR DELETE
  TO anon
  USING (true);

-- ${t('helpSection.sqlComment7')}
INSERT INTO public._heartbeat DEFAULT VALUES;`;

  const SQL_OPTION_1 = `-- ${t('helpSection.option1Title')}
-- ${t('helpSection.option1Description')}

ALTER TABLE public._heartbeat DISABLE ROW LEVEL SECURITY;`;

  const SQL_OPTION_2 = `-- ${t('helpSection.option2Title')}
-- ${t('helpSection.option2Description')}

-- ${t('helpSection.option2Step1')}
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = '_heartbeat' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public._heartbeat';
  END LOOP;
END $$;

-- ${t('helpSection.option2Step2')}
CREATE POLICY "Public select on heartbeat"
  ON public._heartbeat FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert on heartbeat"
  ON public._heartbeat FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public delete on heartbeat"
  ON public._heartbeat FOR DELETE
  TO public
  USING (true);`;

  const SQL_OPTION_3 = `-- ${t('helpSection.option3Title')}
-- ${t('helpSection.option3Description')}

-- Remove políticas antigas
DROP POLICY IF EXISTS "Service role access" ON public._heartbeat;
DROP POLICY IF EXISTS "Anon role access" ON public._heartbeat;

-- Cria políticas para roles específicos
CREATE POLICY "Service role access"
  ON public._heartbeat FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon role access"
  ON public._heartbeat FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);`;

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);
  const [option1Open, setOption1Open] = useState(false);
  const [option2Open, setOption2Open] = useState(false);
  const [option3Open, setOption3Open] = useState(false);
  const [copiedOption1, setCopiedOption1] = useState(false);
  const [copiedOption2, setCopiedOption2] = useState(false);
  const [copiedOption3, setCopiedOption3] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyOption1 = async () => {
    await navigator.clipboard.writeText(SQL_OPTION_1);
    setCopiedOption1(true);
    setTimeout(() => setCopiedOption1(false), 2000);
  };

  const handleCopyOption2 = async () => {
    await navigator.clipboard.writeText(SQL_OPTION_2);
    setCopiedOption2(true);
    setTimeout(() => setCopiedOption2(false), 2000);
  };

  const handleCopyOption3 = async () => {
    await navigator.clipboard.writeText(SQL_OPTION_3);
    setCopiedOption3(true);
    setTimeout(() => setCopiedOption3(false), 2000);
  };

  return (
    <div className="bg-dark-800 border border-dark-700 text-xs font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-dark-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-accent">#</span>
          <span className="text-gray-500">sentinela</span>
          <span className="text-gray-600 ml-2">{t('helpSection.title')}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 text-gray-600" />
        ) : (
          <ChevronDown className="w-3 h-3 text-gray-600" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 border-t border-dark-700">
          <div className="space-y-1 text-gray-500">
            <p>{t('helpSection.description')}</p>
            <p>{t('helpSection.followSteps')}</p>
            <ol className="list-none space-y-0.5 text-gray-600 ml-2">
              <li><span className="text-accent mr-1">1.</span>{t('helpSection.step1')}</li>
              <li><span className="text-accent mr-1">2.</span>{t('helpSection.step2')}</li>
              <li><span className="text-accent mr-1">3.</span>{t('helpSection.step3')}</li>
              <li><span className="text-accent mr-1">4.</span>{t('helpSection.step4')}</li>
            </ol>
          </div>

          <div className="relative">
            <pre className="p-3 bg-dark-900 border border-dark-700 text-gray-500 overflow-x-auto text-[11px] leading-relaxed">
              {SQL_SCRIPT}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopy}
              className="absolute top-2 right-2"
            >
              {copied ? '[copied!]' : '[copy]'}
            </Button>
          </div>

          <div className="border border-dark-700">
            <button
              onClick={() => setIsTroubleshootingOpen(!isTroubleshootingOpen)}
              className="w-full p-3 flex items-center gap-2 text-left hover:bg-dark-700/30 transition-colors"
            >
              <span className="text-yellow-400">[WARN]</span>
              <span className="text-gray-400 font-medium">{t('helpSection.troubleshootingTitle')}</span>
              <span className="text-gray-600 ml-auto">{isTroubleshootingOpen ? '[-]' : '[+]'}</span>
            </button>

            {isTroubleshootingOpen && (
              <div className="px-3 pb-3 space-y-3 border-t border-dark-700">
                <div className="mt-3 px-2 py-1.5 bg-dark-700/50 border border-dark-700">
                  <p className="text-gray-400">{t('helpSection.chooseOneOption')}</p>
                </div>

                {[
                  { open: option1Open, setOpen: setOption1Open, copied: copiedOption1, onCopy: handleCopyOption1, sql: SQL_OPTION_1,
                    title: t('helpSection.option1Title'), desc: t('helpSection.option1Description'), sec: t('helpSection.option1Security'),
                    warn: t('helpSection.option1Warning'), secColor: 'text-gray-500' },
                  { open: option2Open, setOpen: setOption2Open, copied: copiedOption2, onCopy: handleCopyOption2, sql: SQL_OPTION_2,
                    title: t('helpSection.option2Title'), desc: t('helpSection.option2Description'), sec: t('helpSection.option2Security'),
                    warn: t('helpSection.option2Warning'), secColor: 'text-gray-400' },
                  { open: option3Open, setOpen: setOption3Open, copied: copiedOption3, onCopy: handleCopyOption3, sql: SQL_OPTION_3,
                    title: t('helpSection.option3Title'), desc: t('helpSection.option3Description'), sec: t('helpSection.option3Security'),
                    warn: t('helpSection.option3Warning'), secColor: 'text-accent' },
                ].map((opt, idx) => (
                  <div key={idx} className="border border-dark-700">
                    <button
                      onClick={() => opt.setOpen(!opt.open)}
                      className="w-full p-2.5 flex items-center gap-2 text-left hover:bg-dark-700/20 transition-colors"
                    >
                      <span className="text-gray-600">opt_{idx + 1}:</span>
                      <span className="text-gray-400">{opt.title}</span>
                      <span className={`ml-auto text-[10px] ${opt.secColor}`}>[{opt.sec}]</span>
                      <span className="text-gray-600 ml-1">{opt.open ? '[-]' : '[+]'}</span>
                    </button>
                    {opt.open && (
                      <div className="px-3 pb-3 border-t border-dark-700 space-y-2">
                        <div className="mt-2 px-2 py-1.5 bg-dark-700/30 border border-dark-700 text-gray-400">
                          {opt.warn}
                        </div>
                        <div className="relative">
                          <pre className="p-3 bg-dark-900 border border-dark-700 text-gray-500 overflow-x-auto text-[11px] leading-relaxed">
                            {opt.sql}
                          </pre>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={opt.onCopy}
                            className="absolute top-2 right-2"
                          >
                            {opt.copied ? '[copied!]' : '[copy]'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
