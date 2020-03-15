jest.mock("simple-git/promise");

import { checkGit } from "~/utilities";
import simplegit from "simple-git/promise";

test("invalid version", async () => {
	(simplegit as any).mockImplementationOnce(() => ({
		raw: () => "invalid version"
	}));

	const result = await checkGit("1.0.0");

	expect(result).toBeFalsy();
});
