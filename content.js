function mountDiffOnPage(diffText) {
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
    const diffLines = [];
    const maxLength = Math.max(gotLines.length, expectedLines.length);

    for (let i = 0; i < maxLength; i++) {
        const gotLine = gotLines[i];
        const expectedLine = expectedLines[i];

        if (gotLine === expectedLine) {
            diffLines.push(`  ${gotLine}`);
        } else if (gotLine === undefined) {
            diffLines.push(`+ ${expectedLine}`);
        } else if (expectedLine === undefined) {
            diffLines.push(`- ${gotLine}`);
        } else {
            diffLines.push(`- ${gotLine}`);
            diffLines.push(`+ ${expectedLine}`);
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

waitForContent(".fail-details", processFailDetails);
