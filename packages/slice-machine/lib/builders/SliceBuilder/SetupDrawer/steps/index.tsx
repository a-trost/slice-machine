import { Models } from "@slicemachine/core";

import NextSetupStepperConfiguration from "./next";
import NuxtSetupStepperConfiguration from "./nuxt";
import PreviousNextStepperConfiguration from "./previousNext";
import PreviousNuxtSetupStepperConfiguration from "./previousNuxt";
import { SetupStepperConfiguration } from "@builders/SliceBuilder/SetupDrawer/steps/common";

export const getStepperConfigurationByFramework = (
  framework: Models.Frameworks
): SetupStepperConfiguration => {
  switch (framework) {
    case Models.Frameworks.nuxt:
      return NuxtSetupStepperConfiguration;
    case Models.Frameworks.next:
      return NextSetupStepperConfiguration;
    case Models.Frameworks.previousNext:
      return PreviousNextStepperConfiguration;
    case Models.Frameworks.previousNuxt:
      return PreviousNuxtSetupStepperConfiguration;
    default:
      throw new Error(`${framework} : doesn't support simulator`);
  }
};
