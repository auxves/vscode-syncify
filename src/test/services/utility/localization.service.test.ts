import { LocalizationService } from "services/utility/localization.service";

function locale(lang: string): (key: string, ...args: string[]) => string {
  process.env.VSCODE_NLS_CONFIG = JSON.stringify({ locale: lang });
  return LocalizationService.prototype.localize.bind(new LocalizationService());
}

it("should localize english", () => {
  const installed = {
    expected: "Syncify: Installed 5",
    result: locale("en")("info(download).installed", "5")
  };
  expect(installed.result).toBe(installed.expected);

  const uninstalled = {
    expected: "Syncify: Uninstalled 10",
    result: locale("en")("info(download).uninstalled", "10")
  };
  expect(uninstalled.result).toBe(uninstalled.expected);
});

it("should localize russian", () => {
  const installed = {
    expected: "Syncify: Установлен 5",
    result: locale("ru")("info(download).installed", "5")
  };
  expect(installed.result).toBe(installed.expected);

  const uninstalled = {
    expected: "Syncify: Удалить 10",
    result: locale("ru")("info(download).uninstalled", "10")
  };
  expect(uninstalled.result).toBe(uninstalled.expected);
});

it("should localize italian", () => {
  const installed = {
    expected: "Syncify: Installato 5",
    result: locale("it")("info(download).installed", "5")
  };
  expect(installed.result).toBe(installed.expected);

  const uninstalled = {
    expected: "Syncify: Disinstallato 10",
    result: locale("it")("info(download).uninstalled", "10")
  };
  expect(uninstalled.result).toBe(uninstalled.expected);
});

it("should localize portuguese", () => {
  const installed = {
    expected: "Syncify: Instalado 5",
    result: locale("pt-br")("info(download).installed", "5")
  };
  expect(installed.result).toBe(installed.expected);

  const uninstalled = {
    expected: "Syncify: Desinstalado 10",
    result: locale("pt-br")("info(download).uninstalled", "10")
  };
  expect(uninstalled.result).toBe(uninstalled.expected);
});
