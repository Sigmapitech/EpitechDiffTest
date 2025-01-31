function mountDiffOnPage(diffText) {
    const diffBox = document.querySelector(".diff-viewer");

    if (diffBox != null)
        return;

    const diffContainer = document.createElement("div");
    diffContainer.style.border = "1px solid #ccc";
    diffContainer.style.padding = "1em";
    diffContainer.style.marginTop = "2em";
    diffContainer.style.backgroundColor = "#f9f9f9";
    diffContainer.style.fontFamily = "monospace";
    diffContainer.style.whiteSpace = "pre-wrap";
    diffContainer.style.overflow = "auto";

    const diffLines = diffText.split("\n").map((line) => {
        if (line.startsWith("+")) {
            return `<span style="color: green;">${line}</span>`;
        } else if (line.startsWith("-")) {
            return `<span style="color: red;">${line}</span>`;
        } else {
            return `<span>${line}</span>`;
        }
    });

    diffContainer.innerHTML = diffLines.join("<br>");
    diffContainer.classList.add("diff-viewer");

    const failDetails = document.querySelector(".fail-details");
    if (failDetails) {
        failDetails.parentNode.insertBefore(
            diffContainer, failDetails.nextSibling
        );
    } else {
        document.body.appendChild(diffContainer);
        console.warn(
            ".fail-details not found! Appending diff to the body."
        );
    }
}

function computeDiff(got, expected) {
    const gotLines = got.split("\n");
    const expectedLines = expected.split("\n");

    const lcsTable = Array(gotLines.length + 1)
        .fill(null)
        .map(() => Array(expectedLines.length + 1).fill(0));

    for (let i = 1; i <= gotLines.length; i++) {
        for (let j = 1; j <= expectedLines.length; j++) {
            if (gotLines[i - 1] === expectedLines[j - 1]) {
                lcsTable[i][j] = lcsTable[i - 1][j - 1] + 1;
            } else {
                lcsTable[i][j] = Math.max(
                  lcsTable[i - 1][j],
                  lcsTable[i][j - 1]
                );
            }
        }
    }

    let i = gotLines.length,
        j = expectedLines.length;
    const diffLines = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && gotLines[i - 1] === expectedLines[j - 1]) {
            diffLines.unshift(`  ${gotLines[i - 1]}`);
            i--;
            j--;
        } else if (j > 0 && (i === 0 || lcsTable[i][j - 1] >= lcsTable[i - 1][j])) {
            diffLines.unshift(`+ ${expectedLines[j - 1]}`);
            j--;
        } else {
            diffLines.unshift(`- ${gotLines[i - 1]}`);
            i--;
        }
    }

    return diffLines.join("\n");
}
function waitForContent(selector, callback) {
    const target = document.querySelector(selector);

    if (!target) {
        console.warn(`Element with selector '${selector}' not found.`);
        setTimeout(() => waitForContent(selector, callback), 500);
        return;
    } else {
        console.log(`Found ${selector}: ${target.textContent.length}\n`);
    }

    if (target.textContent == "") {
        console.log("Waiting for user interaction to laod the content.");
        setTimeout(() => waitForContent(selector, callback), 500);
        return;
    }
    processFailDetails(target);
}

function processFailDetails(failDetails) {
    const failText = failDetails.textContent;
    const failMatches = failText.match(/# Got:[\s\S]*?# But expected:[\s\S]*?#/);
    if (!failMatches) {
        console.warn("No failure details found in the content!");
        return;
    }

    const failBlock = failMatches[0];
    const gotMatch = failBlock.match(/# Got:\n([\s\S]*?)# But expected:/);
    const expectedMatch = failBlock.match(/# But expected:\n([\s\S]*?)#/);
    if (!gotMatch || !expectedMatch) {
        console.warn("Failed to extract Got and Expected blocks!");
        return;
    }

    const gotContent = gotMatch[1].trim();
    const expectedContent = expectedMatch[1].trim();

    const diffText = computeDiff(gotContent, expectedContent);
    console.log("Computed Diff:\n", diffText);
    mountDiffOnPage(diffText);
}

(function () {
    const pushState = history.pushState;
    history.pushState = function (...args) {
        pushState.apply(history, args);
        printHello();
    };

    const replaceState = history.replaceState;
    history.replaceState = function (...args) {
        replaceState.apply(history, args);
        printHello();
    };

    window.addEventListener(
        "popstate",
        () => waitForContent(".fail-details", processFailDetails));

    const observer = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            waitForContent(".fail-details", processFailDetails);
        }
    });

    let lastUrl = window.location.href;
    observer.observe(document, { childList: true, subtree: true });
})();

waitForContent(".fail-details", processFailDetails);
