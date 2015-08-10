function getDictionaryInfo(word, wordLanguage, callback) {
	$.getJSON("https://en.wiktionary.org/w/api.php?format=json&action=query&titles={word}&rvprop=content&prop=revisions&redirects=1&callback=?".replace("{word}", word), function (data) {

		var results = {
			title: "",
			definitions: []
		}

		var title, content;
		for (var page in data.query.pages) {
			title = data.query.pages[page].title;
			content = data.query.pages[page].revisions[0]["*"];
		}

		results.title = title;

		var text = content.split("\n");

		var heading1Regex = /^(==)([\w\s]+)(==)$/g;
		var heading2Regex = /^(===)([\w\s]+)(===)$/g;
		var linkRegex = /(\[+)(\w+)(\]+)/g;
		var type2LinkRegex = /(\[+)(\w+)([#|\w]+)(\]+)/g;
		var wikipediaArticleRegex = /(\[+)(:?w:)([\w\s]+)\|([\w\s]+)(\]+)/g;
		var contextDataRegex = /(\[+)([\w\W]+)(\]+)|({+)([\w\W]+)(}+)/g;
		var startingAndTrailingCommasRegex = /(^, )|(,$)/g;
		var italicsRegex = /''/g;
		var wordCharactersRegex = /\w/g;

		var heading1, heading2;

		function normalizeWikidata(text) {
			text = text.replace(linkRegex, "$2"); //remove links to other words from definitions;
			text = text.replace(type2LinkRegex, "$2"); //replace links of the form [[information|Information]]
			text = text.replace(wikipediaArticleRegex, "$4"); //replace links to wikipedia articles with the link text
			text = text.replace(contextDataRegex, ""); //get rid of any extra data that is not human-readiable
			return text;
		}


		text.forEach(function (line) {
			//update the current heading if needed
			if (heading1Regex.test(line)) {
				heading1 = line.replace(heading1Regex, "$2");
			}
			if (heading2Regex.test(line)) {
				heading2 = line.replace(heading2Regex, "$2");
			}

			//handle a definition the line contains one

			if (line.indexOf("# ") == 0 && heading1 == wordLanguage) {
				var newDefinition = line.replace("# ", "");
				newDefinition = normalizeWikidata(newDefinition);
				newDefinition = newDefinition.replace(startingAndTrailingCommasRegex, ""); //remove starting and trailing commas that might occur (since some extra data that is removed occurs at the beginning and ends of definitions)
				newDefinition = newDefinition.replace(italicsRegex, "");

				if (wordCharactersRegex.test(newDefinition)) { //makes sure there is actually a definition
					results.definitions.push({
						meaning: newDefinition,
						type: heading2
					});
				}

			}
		});

		callback(results);
	});
}
