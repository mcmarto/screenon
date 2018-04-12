from setuptools import setup

setup(
    name="screenon",
    packages=["screenon"],
    include_package_data=True,
    install_requires=[ 'flask', 'flask-cors']
)
