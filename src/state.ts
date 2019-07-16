import { IExtensionState } from "./models/state.model";
import { LocalizationService } from "./services/localization.service";

export const state: IExtensionState = {
  localize: LocalizationService.prototype.localize.bind(
    new LocalizationService()
  )
};
