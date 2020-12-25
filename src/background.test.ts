describe("background.ts", () => {
    const importBackground = () => import("./background");

    beforeEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    });

    it("should expose Config on window.SB", async () => {
        expect(window.SB).toBeUndefined();
        await importBackground();
        expect(window.SB).not.toBeUndefined();
    });

    it("should send 'updated' message on tabs.onUpdated", async (done) => {
        const origOnUpdated = chrome.tabs.onUpdated;
        chrome.tabs.onUpdated.addListener = jest.fn(); // stub function (just to make sure)
        const onUpdated = chrome.tabs.onUpdated.addListener as jest.Mock;

        const origSendMessage = chrome.tabs.sendMessage;
        chrome.tabs.sendMessage = jest.fn(); // prevent message from actualy beeing sent
        const sendMessage = chrome.tabs.sendMessage as jest.Mock;

        onUpdated.mockImplementationOnce((cb) => {
            const TAB_ID = 1337;
            cb(TAB_ID);

            expect(sendMessage).toHaveBeenCalled();
            const args = sendMessage.mock.calls[0];
            expect(args[0]).toEqual(TAB_ID);
            expect(args[1]).toEqual({ message: "update" });

            chrome.tabs.onUpdated = origOnUpdated;
            chrome.tabs.sendMessage = origSendMessage;
            done();
        });
        await importBackground();
    });
});
