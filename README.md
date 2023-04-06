This Chrome extension loops over titles & headlines on the page; sends them to an A.I. to analyze for yellow journalism; and in case the A.I. is confident it's YJ, it marks the element with a yellow background.
To learn the A.I.'s reasoning as to why it's yellow journalism, hover your mouse over the yellow background, and a text popup will give further explanation.

Note that this extension is still in early alpha.
You will need to generate an OpenAI API key and hardcode it into the source files. Check the top of content.js for details.

The quality of the analysis is currently derived from OpenAI's "gpt3.5-turbo" model. Lay tests have confirmed it to be mostly accurate in most cases, but it sometimes misses the mark. Results may not always be exactly reproducible, though they tend to converge.
