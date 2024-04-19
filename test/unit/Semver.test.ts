import { SemVer } from "semver";

describe("SemVer tests", () => {

    test("Parsing release version", () => {
        const ver: SemVer = new SemVer("1.2.3");
        expect(ver).toBeDefined()
        expect(ver.prerelease.length).toBe(0)
    });

    test("Parsing SNAPSHOT version", () => {
        const ver: SemVer = new SemVer("1.2.3-SNAPSHOT");
        expect(ver).toBeDefined()
        expect(ver.prerelease).toBeTruthy()
    });

    /**
     * This test was added to check the behavior of SemVer to cut the build meta information. 
     * We do not want to do that. The Version implementstion is fixing this. The need for the
     * fix is tested here.
     */
    test("parsing with full information", () => {
        const ver = new SemVer("6.0.14-unstable.3629a7b.0+3629a7");
        expect(ver.toString()).toBe("6.0.14-unstable.3629a7b.0")
    })

});