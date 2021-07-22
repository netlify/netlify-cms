export function remarkParseShortcodes({ plugins }) {
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.blockTokenizers;
  const methods = Parser.prototype.blockMethods;

  tokenizers.shortcode = createShortcodeTokenizer({ plugins });

  methods.unshift('shortcode');
}

function createShortcodeTokenizer({ plugins }) {
  return function tokenizeShortcode(eat, value, silent) {
    // Attempt to find a regex match for each plugin's pattern, and then
    // select the first by its occurence in `value`. This ensures we won't
    // skip a plugin that occurs later in the plugin registry, but earlier
    // in the `value`.
    const { plugin, match } =
      plugins
        .toList()
        .map(plugin => ({
          match: value.match(plugin.pattern),
          plugin,
        }))
        .filter(({ match }) => !!match)
        .reduce((a, b) => (a.match.index < b.match.index ? a : b)) ?? {};

    if (match) {
      if (silent) {
        return true;
      }

      const shortcodeData = plugin.fromBlock(match);

      try {
        return eat(match[0])({
          type: 'shortcode',
          data: { shortcode: plugin.id, shortcodeData },
        });
      } catch (e) {
        console.warn(
          `Sent invalid data to remark. Plugin: ${plugin.id}. Value: ${
            match[0]
          }. Data: ${JSON.stringify(shortcodeData)}`,
        );
        return false;
      }
    }
  };
}

export function createRemarkShortcodeStringifier({ plugins }) {
  return function remarkStringifyShortcodes() {
    const Compiler = this.Compiler;
    const visitors = Compiler.prototype.visitors;

    visitors.shortcode = shortcode;

    function shortcode(node) {
      const { data } = node;
      const plugin = plugins.find(plugin => data.shortcode === plugin.id);
      return plugin.toBlock(data.shortcodeData);
    }
  };
}
