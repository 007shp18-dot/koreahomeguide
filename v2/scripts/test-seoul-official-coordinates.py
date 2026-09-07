import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('seed', pathlib.Path(__file__).with_name('prepare-seoul-official-coordinates.py'))
seed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seed)


class OfficialCoordinatesTest(unittest.TestCase):
    def row(self, **changes):
        return {'k-아파트코드': 'A10024691', 'k-아파트명': '용산센트럴파크',
                'kapt도로명주소': '서울특별시 용산구 서빙고로 17', '사용허가여부': 'Y',
                '좌표X': '126.967663', '좌표Y': '37.526093', **changes}

    def test_longitude_latitude_order(self):
        accepted, rejected = seed.normalize([self.row()])
        self.assertEqual(accepted[0]['latitude'], 37.526093)
        self.assertEqual(accepted[0]['longitude'], 126.967663)
        self.assertEqual(rejected, {})

    def test_ambiguous_codes_are_not_selected_arbitrarily(self):
        self.assertEqual(seed.normalize([self.row(), self.row()])[0], [])

    def test_invalid_coordinates_are_not_invented(self):
        for changes in [{'좌표X': ''}, {'좌표Y': 'NaN'}, {'좌표X': '37.5', '좌표Y': '127'}, {'좌표Y': '35.1'}]:
            with self.subTest(changes=changes):
                self.assertEqual(seed.normalize([self.row(**changes)])[0], [])

    def test_inactive_and_non_seoul_are_excluded(self):
        for changes in [{'사용허가여부': 'N'}, {'kapt도로명주소': '경기도 성남시'}]:
            self.assertEqual(seed.normalize([self.row(**changes)])[0], [])


if __name__ == '__main__':
    unittest.main()
