const { composePlugins, withNx } = require("@nx/webpack");

// Nx plugins for webpack.
module.exports = composePlugins(
	withNx({
		target: "node",
	}),
	config => {
		config.plugins = config.plugins
			?.filter(Boolean)
			.filter(plugin =>
				typeof plugin === "function"
					? plugin.name !== "ForkTsCheckerWebpackPlugin"
					// @ts-expect-error Not possible for this to be nullish
					: plugin.constructor.name !== "ForkTsCheckerWebpackPlugin"
			);

		return config;
	}
);
