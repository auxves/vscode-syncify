import { O } from "ts-toolbelt";
import { ISettings } from "~/models";

export type PartialSettings = O.Optional<ISettings, keyof ISettings, "deep">;
