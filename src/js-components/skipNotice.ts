'use strict';

/**
 * The notice that tells the user that a sponsor was just skipped
 */
class SkipNotice {
    parent: HTMLElement;
    UUID: string;
    manualSkip: boolean;
    // Contains functions and variables from the content script needed by the skip notice
    contentContainer: () => any;
    
    maxCountdownTime: () => number;
    countdownTime: any;
    countdownInterval: NodeJS.Timeout;
    unskipCallback: any;
    idSuffix: any;

	constructor(parent: HTMLElement, UUID: string, manualSkip: boolean = false, contentContainer) {
        this.parent = parent;
        this.UUID = UUID;
        this.manualSkip = manualSkip;
        this.contentContainer = contentContainer;

        let noticeTitle = chrome.i18n.getMessage("noticeTitle");

        if (manualSkip) {
            noticeTitle = chrome.i18n.getMessage("noticeTitleNotSkipped");
        }

        this.maxCountdownTime = () => 4;
        //the countdown until this notice closes
        this.countdownTime = this.maxCountdownTime();
        //the id for the setInterval running the countdown
        this.countdownInterval = null;

        //the unskip button's callback
        this.unskipCallback = this.unskip.bind(this);

        //add notice
        let amountOfPreviousNotices = document.getElementsByClassName("sponsorSkipNotice").length;

        //this is the suffix added at the end of every id
        this.idSuffix = this.UUID + amountOfPreviousNotices;

        if (amountOfPreviousNotices > 0) {
            //already exists

            let previousNotice = document.getElementsByClassName("sponsorSkipNotice")[0];
            previousNotice.classList.add("secondSkipNotice")
        }

        let noticeElement = document.createElement("div");
        //what sponsor time this is about
        noticeElement.id = "sponsorSkipNotice" + this.idSuffix;
        noticeElement.classList.add("sponsorSkipObject");
        noticeElement.classList.add("sponsorSkipNotice");
        noticeElement.style.zIndex = String(50 + amountOfPreviousNotices);

        //add mouse enter and leave listeners
        noticeElement.addEventListener("mouseenter", this.pauseCountdown.bind(this));
        noticeElement.addEventListener("mouseleave", this.startCountdown.bind(this));

        //the row that will contain the info
        let firstRow = document.createElement("tr");
        firstRow.id = "sponsorSkipNoticeFirstRow" + this.idSuffix;

        let logoColumn = document.createElement("td");

        let logoElement = document.createElement("img");
        logoElement.id = "sponsorSkipLogo" + this.idSuffix;
        logoElement.className = "sponsorSkipLogo sponsorSkipObject";
        logoElement.src = chrome.extension.getURL("icons/IconSponsorBlocker256px.png");

        let noticeMessage = document.createElement("span");
        noticeMessage.id = "sponsorSkipMessage" + this.idSuffix;
        noticeMessage.classList.add("sponsorSkipMessage");
        noticeMessage.classList.add("sponsorSkipObject");
        noticeMessage.innerText = noticeTitle;

        //create the first column
        logoColumn.appendChild(logoElement);
        logoColumn.appendChild(noticeMessage);

        //add the x button
        let closeButtonContainer = document.createElement("td");
        closeButtonContainer.className = "sponsorSkipNoticeRightSection";
        closeButtonContainer.style.top = "11px";

        let timeLeft = document.createElement("span");
        timeLeft.id = "sponsorSkipNoticeTimeLeft" + this.idSuffix;
        timeLeft.innerText = this.countdownTime + "s";
        timeLeft.className = "sponsorSkipObject sponsorSkipNoticeTimeLeft";

        let hideButton = document.createElement("img");
        hideButton.src = chrome.extension.getURL("icons/close.png");
        hideButton.className = "sponsorSkipObject sponsorSkipNoticeButton sponsorSkipNoticeCloseButton sponsorSkipNoticeRightButton";
        hideButton.addEventListener("click", this.close.bind(this));

        closeButtonContainer.appendChild(timeLeft);
        closeButtonContainer.appendChild(hideButton);

        //add all objects to first row
        firstRow.appendChild(logoColumn);
        firstRow.appendChild(closeButtonContainer);

        let spacer = document.createElement("hr");
        spacer.id = "sponsorSkipNoticeSpacer" + this.idSuffix;
        spacer.className = "sponsorBlockSpacer";

        //the row that will contain the buttons
        let secondRow = document.createElement("tr");
        secondRow.id = "sponsorSkipNoticeSecondRow" + this.idSuffix;
        
        //thumbs up and down buttons
        let voteButtonsContainer = document.createElement("td");
        voteButtonsContainer.id = "sponsorTimesVoteButtonsContainer" + this.idSuffix;
        voteButtonsContainer.className = "sponsorTimesVoteButtonsContainer"

        let reportText = document.createElement("span");
        reportText.id = "sponsorTimesReportText" + this.idSuffix;
        reportText.className = "sponsorTimesInfoMessage sponsorTimesVoteButtonMessage";
        reportText.innerText = chrome.i18n.getMessage("reportButtonTitle");
        reportText.style.marginRight = "5px";
        reportText.setAttribute("title", chrome.i18n.getMessage("reportButtonInfo"));

        let downvoteButton = document.createElement("img");
        downvoteButton.id = "sponsorTimesDownvoteButtonsContainer" + this.idSuffix;
        downvoteButton.className = "sponsorSkipObject voteButton";
        downvoteButton.src = chrome.extension.getURL("icons/report.png");
        downvoteButton.addEventListener("click", () => this.contentContainer().vote(0, this.UUID, this));
        downvoteButton.setAttribute("title", chrome.i18n.getMessage("reportButtonInfo"));

        //add downvote and report text to container
        voteButtonsContainer.appendChild(reportText);
        voteButtonsContainer.appendChild(downvoteButton);

        //add unskip button
        let unskipContainer = document.createElement("td");
        unskipContainer.className = "sponsorSkipNoticeUnskipSection";

        let unskipButton = document.createElement("button");
        unskipButton.id = "sponsorSkipUnskipButton" + this.idSuffix;
        unskipButton.innerText = chrome.i18n.getMessage("unskip");
        unskipButton.className = "sponsorSkipObject sponsorSkipNoticeButton";
        unskipButton.addEventListener("click", this.unskipCallback);

        unskipButton.style.marginLeft = "4px";

        unskipContainer.appendChild(unskipButton);

        //add don't show again button
        let dontshowContainer = document.createElement("td");
        dontshowContainer.className = "sponsorSkipNoticeRightSection";

        let dontShowAgainButton = document.createElement("button");
        dontShowAgainButton.innerText = chrome.i18n.getMessage("Hide");
        dontShowAgainButton.className = "sponsorSkipObject sponsorSkipNoticeButton sponsorSkipNoticeRightButton";
        dontShowAgainButton.addEventListener("click", this.contentContainer().dontShowNoticeAgain);

        // Don't let them hide it if manually skipping
        if (!this.manualSkip) {
            dontshowContainer.appendChild(dontShowAgainButton);
        }

        //add to row
        secondRow.appendChild(voteButtonsContainer);
        secondRow.appendChild(unskipContainer);
        secondRow.appendChild(dontshowContainer);

        noticeElement.appendChild(firstRow);
        noticeElement.appendChild(spacer);
        noticeElement.appendChild(secondRow);

        //get reference node
        let referenceNode = document.getElementById("movie_player") || document.querySelector("#player-container .video-js");
        if (referenceNode == null) {
            //for embeds
            let player = document.getElementById("player");
            referenceNode = <HTMLElement> player.firstChild;
            let index = 1;

            //find the child that is the video player (sometimes it is not the first)
            while (!referenceNode.classList.contains("html5-video-player") || !referenceNode.classList.contains("ytp-embed")) {
                referenceNode = <HTMLElement> player.children[index];

                index++;
            }
        }

        referenceNode.prepend(noticeElement);

        if (manualSkip) {
            this.unskippedMode(chrome.i18n.getMessage("skip"));
        }

        this.startCountdown();
    }

    //called every second to lower the countdown before hiding the notice
    countdown() {
        this.countdownTime--;

        if (this.countdownTime <= 0) {
            //remove this from setInterval
            clearInterval(this.countdownInterval);

            //time to close this notice
            this.close();

            return;
        }

        if (this.countdownTime == 3) {
            //start fade out animation
            let notice = document.getElementById("sponsorSkipNotice" + this.idSuffix);
            notice.style.removeProperty("animation");
            notice.classList.add("sponsorSkipNoticeFadeOut");
        }

        this.updateTimerDisplay();
    }

    pauseCountdown() {
        //remove setInterval
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;

        //reset countdown
        this.countdownTime = this.maxCountdownTime();
        
        //inform the user
        let timeLeft = document.getElementById("sponsorSkipNoticeTimeLeft" + this.idSuffix);
        timeLeft.innerText = chrome.i18n.getMessage("paused");

        //remove the fade out class if it exists
        let notice = document.getElementById("sponsorSkipNotice" + this.idSuffix);
        notice.classList.remove("sponsorSkipNoticeFadeOut");
        notice.style.animation = "none";
    }

    startCountdown() {
        //if it has already started, don't start it again
        if (this.countdownInterval !== null) return;

        this.countdownInterval = setInterval(this.countdown.bind(this), 1000);

        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        //update the timer display
        let timeLeft = document.getElementById("sponsorSkipNoticeTimeLeft" + this.idSuffix);
        timeLeft.innerText = this.countdownTime + "s";
    }

    unskip() {
        this.contentContainer().unskipSponsorTime(this.UUID);

        this.unskippedMode(chrome.i18n.getMessage("reskip"));
    }

    /** Sets up notice to be not skipped yet */
    unskippedMode(buttonText) {
        //change unskip button to a reskip button
        let unskipButton = this.changeUnskipButton(buttonText);

        //setup new callback
        this.unskipCallback = this.reskip.bind(this);
        unskipButton.addEventListener("click", this.unskipCallback);

        //change max duration to however much of the sponsor is left
        this.maxCountdownTime = function() {
            let sponsorTime = this.contentContainer().sponsorTimes[this.contentContainer().UUIDs.indexOf(this.UUID)];
            let duration = Math.round(sponsorTime[1] - this.contentContainer().v.currentTime);

            return Math.max(duration, 4);
        };

        this.countdownTime = this.maxCountdownTime();
        this.updateTimerDisplay();
    }

    reskip() {
        this.contentContainer().reskipSponsorTime(this.UUID);

        //change reskip button to a unskip button
        let unskipButton = this.changeUnskipButton(chrome.i18n.getMessage("unskip"));

        //setup new callback
        this.unskipCallback = this.unskip.bind(this);
        unskipButton.addEventListener("click", this.unskipCallback);

        //reset duration
        this.maxCountdownTime = () => 4;
        this.countdownTime = this.maxCountdownTime();
        this.updateTimerDisplay();

        // See if the title should be changed
        if (this.manualSkip) {
            this.changeNoticeTitle(chrome.i18n.getMessage("noticeTitle"));

            this.contentContainer().vote(1, this.UUID, this);
        }
    }

    /**
     * Changes the text on the reskip button
     * 
     * @param {string} text 
     * @returns {HTMLElement} unskipButton
     */
    changeUnskipButton(text) {
        let unskipButton = document.getElementById("sponsorSkipUnskipButton" + this.idSuffix);
        unskipButton.innerText = text;
        unskipButton.removeEventListener("click", this.unskipCallback);

        return unskipButton;
    }

    afterDownvote() {
        this.addVoteButtonInfo(chrome.i18n.getMessage("voted"));
        this.addNoticeInfoMessage(chrome.i18n.getMessage("hitGoBack"));
        
        //remove this sponsor from the sponsors looked up
        //find which one it is
        for (let i = 0; i < this.contentContainer().sponsorTimes.length; i++) {
            if (this.contentContainer().UUIDs[i] == this.UUID) {
                //this one is the one to hide
                
                //add this as a hidden sponsorTime
                this.contentContainer().hiddenSponsorTimes.push(i);
            
                this.contentContainer().updatePreviewBar();
                break;
            }
        }
    }

    changeNoticeTitle(title) {
        let noticeElement = document.getElementById("sponsorSkipMessage" + this.idSuffix);

        noticeElement.innerText = title;
    }
    
    addNoticeInfoMessage(message: string, message2: string = "") {
        let previousInfoMessage = document.getElementById("sponsorTimesInfoMessage" + this.idSuffix);
        if (previousInfoMessage != null) {
            //remove it
            document.getElementById("sponsorSkipNotice" + this.idSuffix).removeChild(previousInfoMessage);
        }

        let previousInfoMessage2 = document.getElementById("sponsorTimesInfoMessage" + this.idSuffix + "2");
        if (previousInfoMessage2 != null) {
            //remove it
            document.getElementById("sponsorSkipNotice" + this.idSuffix).removeChild(previousInfoMessage2);
        }
        
        //add info
        let thanksForVotingText = document.createElement("p");
        thanksForVotingText.id = "sponsorTimesInfoMessage" + this.idSuffix;
        thanksForVotingText.className = "sponsorTimesInfoMessage";
        thanksForVotingText.innerText = message;

        //add element to div
        document.getElementById("sponsorSkipNotice" + this.idSuffix).insertBefore(thanksForVotingText, document.getElementById("sponsorSkipNoticeSpacer" + this.idSuffix));
    
        if (message2 !== undefined) {
            let thanksForVotingText2 = document.createElement("p");
            thanksForVotingText2.id = "sponsorTimesInfoMessage" + this.idSuffix + "2";
            thanksForVotingText2.className = "sponsorTimesInfoMessage";
            thanksForVotingText2.innerText = message2;

            //add element to div
            document.getElementById("sponsorSkipNotice" + this.idSuffix).insertBefore(thanksForVotingText2, document.getElementById("sponsorSkipNoticeSpacer" + this.idSuffix));
        }
    }
    
    resetNoticeInfoMessage() {
        let previousInfoMessage = document.getElementById("sponsorTimesInfoMessage" + this.idSuffix);
        if (previousInfoMessage != null) {
            //remove it
            document.getElementById("sponsorSkipNotice" + this.idSuffix).removeChild(previousInfoMessage);
        }
    }
    
    addVoteButtonInfo(message) {
        this.resetVoteButtonInfo();
        
        //hide report button and text for it
        let downvoteButton = document.getElementById("sponsorTimesDownvoteButtonsContainer" + this.idSuffix);
        if (downvoteButton != null) {
            downvoteButton.style.display = "none";
        }
        let downvoteButtonText = document.getElementById("sponsorTimesReportText" + this.idSuffix);
        if (downvoteButtonText != null) {
            downvoteButtonText.style.display = "none";
        }
        
        //add info
        let thanksForVotingText = document.createElement("td");
        thanksForVotingText.id = "sponsorTimesVoteButtonInfoMessage" + this.idSuffix;
        thanksForVotingText.className = "sponsorTimesInfoMessage sponsorTimesVoteButtonMessage";
        thanksForVotingText.innerText = message;

        //add element to div
        document.getElementById("sponsorSkipNoticeSecondRow" + this.idSuffix).prepend(thanksForVotingText);
    }
    
    resetVoteButtonInfo() {
        let previousInfoMessage = document.getElementById("sponsorTimesVoteButtonInfoMessage" + this.idSuffix);
        if (previousInfoMessage != null) {
            //remove it
            document.getElementById("sponsorSkipNoticeSecondRow" + this.idSuffix).removeChild(previousInfoMessage);
        }

        //show button again
        document.getElementById("sponsorTimesDownvoteButtonsContainer" + this.idSuffix).style.removeProperty("display");
    }
    
    //close this notice
    close() {
        //reset message
        this.resetNoticeInfoMessage();

        let notice = document.getElementById("sponsorSkipNotice" + this.idSuffix);
        if (notice != null) {
            notice.remove();
        }

        //remove setInterval
        if (this.countdownInterval !== null) clearInterval(this.countdownInterval);
    }

}

export default SkipNotice;